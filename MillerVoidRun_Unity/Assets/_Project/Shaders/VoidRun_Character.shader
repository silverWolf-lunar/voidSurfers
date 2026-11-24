Shader "VoidRun/Character"
{
    Properties
    {
        _BaseColor ("Base Color", Color) = (0.11, 0.09, 0.18, 1)
        _BaseMap ("Base Map", 2D) = "white" {}
        _VoidGlowColor ("Void Glow Color", Color) = (0.71, 0.31, 1.0, 1)
        _VoidGlowStrength ("Void Glow Strength", Range(0, 3)) = 0.6
        _RimPower ("Rim Power", Range(0.5, 8)) = 3.0
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" "RenderPipeline"="UniversalPipeline" }
        LOD 200
        Pass
        {
            Name "ForwardLit"
            Tags { "LightMode"="UniversalForward" }
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            struct Attributes
            {
                float4 positionOS : POSITION;
                float3 normalOS   : NORMAL;
                float2 uv         : TEXCOORD0;
            };
            struct Varyings
            {
                float4 positionHCS : SV_POSITION;
                float3 normalWS    : TEXCOORD0;
                float3 viewDirWS   : TEXCOORD1;
                float2 uv          : TEXCOORD2;
            };

            TEXTURE2D(_BaseMap);
            SAMPLER(sampler_BaseMap);
            CBUFFER_START(UnityPerMaterial)
                half4 _BaseColor;
                half4 _VoidGlowColor;
                half _VoidGlowStrength;
                half _RimPower;
            CBUFFER_END

            Varyings vert(Attributes IN)
            {
                Varyings OUT;
                VertexPositionInputs pos = GetVertexPositionInputs(IN.positionOS.xyz);
                OUT.positionHCS = pos.positionCS;
                OUT.normalWS = TransformObjectToWorldNormal(IN.normalOS);
                OUT.viewDirWS = GetWorldSpaceViewDir(pos.positionWS);
                OUT.uv = IN.uv;
                return OUT;
            }

            half4 frag(Varyings IN) : SV_Target
            {
                half4 tex = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, IN.uv) * _BaseColor;
                Light mainLight = GetMainLight();
                float3 N = normalize(IN.normalWS);
                float3 V = normalize(IN.viewDirWS);
                // Stylised 2-band toon diffuse
                half NdotL = saturate(dot(N, mainLight.direction));
                half toon = smoothstep(0.2, 0.25, NdotL) * 0.65 + 0.35;
                half rim = pow(1.0 - saturate(dot(N, V)), _RimPower);
                half3 col = tex.rgb * mainLight.color * toon + _VoidGlowColor.rgb * rim * _VoidGlowStrength;
                return half4(col, 1.0);
            }
            ENDHLSL
        }
    }
}
